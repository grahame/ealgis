# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2016-12-17 11:17
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ealauth', '0005_auto_20161217_1056'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='columninfo',
            options={},
        ),
        migrations.AlterModelOptions(
            name='datatableinfo',
            options={},
        ),
        migrations.AlterModelOptions(
            name='geometrysourceprojected',
            options={'verbose_name': 'Geometry source projection', 'verbose_name_plural': 'Geometry source projections'},
        ),
    ]
